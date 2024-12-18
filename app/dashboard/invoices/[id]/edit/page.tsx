import Form from "@/app/ui/invoices/edit-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { fetchInvoiceById, fetchCustomers } from "@/app/lib/data";
import { notFound } from "next/navigation";

export default async function Page (props: { params: Promise<{ id: string }> })
{
    // Access the dynamic route parameter "id".
    const params = await props.params;
    const id = params.id;

    // Fetch the selected invoice entry in the DB.
    const [invoice, customers] = await Promise.all ([
        fetchInvoiceById (id),
        fetchCustomers (),
    ]);

    // EARLY EXIT - The specified invoice was not found.
    if (!invoice)
    {
        notFound ();
    }

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    {label: 'Invoice', href: '/dashboard/invoices'},
                    {
                        label: 'Edit Invoice',
                        href: `/dashboard/invoices/${id}/edit`,
                        active: true,
                    },
                ]}
            />
            <Form invoice={invoice} customers={customers} />
        </main>
    );
}