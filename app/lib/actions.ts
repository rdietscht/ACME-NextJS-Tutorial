'use server'; // Mark all exported functions as Server Actions

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// The expected types of data for the Invoice entries in the database.
const FormSchema = z.object ({
    id: z.string (),
    customerId: z.string (),
    amount: z.coerce.number (),
    status: z.enum (['pending', 'paid']),
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

export async function updateInvoice (id: string, formData: FormData)
{
    const { customerId, amount, status } = UpdateInvoice.parse ({
        customerId: formData.get ('customerId'),
        amount: formData.get ('amount'),
        status: formData.get ('status'),
    });

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

export async function createInvoice (formData: FormData)
{
    const { customerId, amount, status } = CreateInvoice.parse ({
        customerId: formData.get ('customerId'),
        amount: formData.get ('amount'),
        status: formData.get ('status'),
    });

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