import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-6">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Account Created!</CardTitle>
            <CardDescription className="text-gray-600">Please check your email to verify your account</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-6">
              We've sent a verification email to your inbox. Please click the link in the email to activate your account
              and complete the registration process.
            </p>
            <Button asChild className="w-full h-11 bg-blue-600 hover:bg-blue-700">
              <Link href="/auth/login">Return to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
