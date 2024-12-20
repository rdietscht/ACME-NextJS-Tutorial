import NextAuth from "./node_modules/.pnpm/next-auth@5.0.0-beta.25_next@15.1.0_react-dom@19.0.0-rc-cd22717c-20241013_react@19.0.0-rc-cd2_vpnyommcfiul5rcc26jgvsqwl4/node_modules/next-auth";
import { authConfig } from "./auth.config";

export default NextAuth (authConfig).auth;

export const config =
{
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};