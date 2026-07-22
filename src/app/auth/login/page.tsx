'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export const dynamic = 'force-dynamic'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for success message from signup
    const message = searchParams.get('message')
    if (message) {
      setSuccessMessage(message)
      setTimeout(() => setSuccessMessage(''), 5000)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Login failed. Please check your credentials.')
        return
      }

      // Login successful
      router.push('/dashboard')
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">T</span>
          </div>
        </div>

        {/* Headers */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Login</h2>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Login to your account</h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-8">
          Thank you for returning to <strong>Topchart</strong> web application. Please provide the following information to access your dashboard.
        </p>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-gray-700 font-medium mb-2 block">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-gray-700 font-medium mb-2 block">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-gray-700 text-sm cursor-pointer">
                Remember Me
              </Label>
            </div>
            <Link href="/auth/forgot-password" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
              Forget password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded mt-6"
          >
            {isLoading ? 'LOGGING IN...' : 'LOGIN'}
          </Button>
        </form>

        {/* Signup Link */}
        <div className="mt-6 text-center text-gray-700">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-gray-900 font-bold hover:text-purple-600">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
