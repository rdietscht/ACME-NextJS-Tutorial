'use server'; // Mark all exported functions as Server Actions

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// The expected types of data for the Invoice entries in the database.
const FormSchema = z.object ({
    id: z.string (),
    customerId: z.string ({
        invalid_type_error: 'Please select a customer.', // Send friendly message if empty string detected
    }),
    amount: z.coerce
        .number () // Force the entered input to be a number
        .gt (0, { message: 'Please enter an amount greater than $0.' }), // Ensure the number is > 0
    status: z.enum (['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.', // Send friendly message if empty string detected
    }),
    date: z.string (),
});

const CreateInvoice = FormSchema.omit ({ id: true, date: true });
const UpdateInvoice = FormSchema.omit ({ id: true, date: true });

export async function deleteInvoice (id: string)
{
    try
    {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        // No need to call redirect, since this should be called within the same revalidate path.
        revalidatePath ('/dashboard/invoices');
        return { message: 'Deleted Invoice.' };

    } catch (error)
    {
        return {
            message: 'Database Error: Failed to delete invoice.',
        };
    }
}

export async function updateInvoice (id: string, prevState: State, formData: FormData)
{
    const validatedFields = UpdateInvoice.safeParse ({
        customerId: formData.get ('customerId'),
        amount: formData.get ('amount'),
        status: formData.get ('status'),
    });

    console.log (validatedFields); // DEBUGGING!

    // EARLY EXIT - One/more of the fields were invalid.
    if (!validatedFields.success)
    {
        return {
            errors: validatedFields.error.flatten ().fieldErrors,
            message: 'Missing Fields. Failed to update Invoice.',
        }
    }

    // Extract the valid data from validatedFields.
    const { customerId, amount, status } = validatedFields.data;

    const amountInCents = amount * 100;

    try
    {
        await sql`
            UPDATE invoices
            SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
            WHERE id = ${id}
        `;
    } catch (error)
    {
        return {
            message: 'Database Error: Failed to update Invoice.',
        };
    }

    revalidatePath ('/dashboard/invoices');
    redirect ('/dashboard/invoices');
}

// Custom msg state type used by the createInvoice formAction.
export type State =
{
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

export async function createInvoice (prevState: State, formData: FormData)
{
    const validatedFields = CreateInvoice.safeParse ({
        customerId: formData.get ('customerId'),
        amount: formData.get ('amount'),
        status: formData.get ('status'),
    });

    // console.log (validatedFields); // DEBUGGING!

    // EARLY EXIT - One/more of the fields were invalid.
    if (!validatedFields.success)
    {
        return {
            errors: validatedFields.error.flatten ().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    // Extract the data from the validatedFields.data property.
    const { customerId, amount, status } = validatedFields.data;

    // Convert monetary value to cents to avoid floating-point error.
    const amountInCents = amount * 100;

    // Construct a new Data object with the 'YYYY-MM-DD' format.
    const date = new Date ().toISOString ().split ('T')[0];

    try {
        // Execute the sql statement on the server.
        await sql`
            INSERT INTO invoices (customer_id, amount, status, date)
            VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    } catch (error)
    {
        return {
            message: 'Database Error: Failed to create Invoice.',
        };
    }

    // Send a new request to the server to render the new invoices data.
    revalidatePath ('/dashboard/invoices');
    redirect ('/dashboard/invoices');
}