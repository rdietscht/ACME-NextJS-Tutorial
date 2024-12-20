import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { sql } from "@vercel/postgres";
import type { User } from "@/app/lib/definitions";
import bcrypt from 'bcrypt';

// Helper function which makes a DB query to fetch a specific user entity given an email.
async function getUser (email: string): Promise<User | undefined>
{
    try
    {
        const user = await sql<User>`SELECT * FROM users WHERE email=${email}`;
        return user.rows[0];
    } catch (error)
    {
        console.error ('Failed to fetch user:', error);
        throw new Error ('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut } = NextAuth ({
    ...authConfig,
    providers: [
        Credentials ({
            // Use the authorize function to handle authentication logic.
            async authorize (credentials)
            {
                // Use zod to validate entered form data.
                const parsedCredentials = z
                    .object ({ email: z.string ().email (), password: z.string ().min (6) })
                    .safeParse (credentials);

                // Ensure the form was validated by zod.
                if (parsedCredentials.success)
                {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser (email);
                    if (!user) return null; // The user with the provided email was not found

                    // Check if the passwords match using bcrypt.
                    const passwordsMatch = await bcrypt.compare (password, user.password);
                    if (passwordsMatch) return user; // Return the user's data if authenticated
                }

                // Code reaches here if either zod was unable to validate OR the password was incorrect.
                console.log ('Invalid credentials');
                return null;
            },
        }),
    ] // Generally, we would use something else
});