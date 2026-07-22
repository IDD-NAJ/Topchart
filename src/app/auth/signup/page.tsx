'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export const dynamic = 'force-dynamic'

function SignupForm() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrors({})

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!agreeTerms) {
      setError('You must agree to the terms and conditions')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          password,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        if (data.errors && typeof data.errors === 'object') {
          setErrors(data.errors)
        }
        setError(data.error || 'Signup failed. Please check your information.')
        return
      }

      router.push('/auth/login?message=Account created successfully. Please log in.')
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 max-h-[90vh] overflow-y-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">T</span>
          </div>
        </div>

        {/* Headers */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Account</h2>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Join Topchart Today</h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-8">
          Sign up for <strong>Topchart</strong> and enjoy our affordable data bundles and services across Ghana.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div>
            <Label htmlFor="firstName" className="text-gray-700 font-medium mb-2 block">
              First Name
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {errors.first_name && <p className="text-red-600 text-xs mt-1">{errors.first_name}</p>}
          </div>

          {/* Last Name */}
          <div>
            <Label htmlFor="lastName" className="text-gray-700 font-medium mb-2 block">
              Last Name
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {errors.last_name && <p className="text-red-600 text-xs mt-1">{errors.last_name}</p>}
          </div>

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
            {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone" className="text-gray-700 font-medium mb-2 block">
              Phone Number (024XXXXXXX)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="024XXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-gray-700 font-medium mb-2 block">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-gray-500 text-xs mt-1">Min 8 chars, 1 uppercase, 1 number, 1 special char</p>
            {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword" className="text-gray-700 font-medium mb-2 block">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start gap-2 py-2">
            <Checkbox
              id="terms"
              checked={agreeTerms}
              onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-gray-600 text-xs cursor-pointer leading-tight mt-1">
              I agree to the{' '}
              <Link href="/terms" className="text-purple-600 hover:text-purple-700 font-medium">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-purple-600 hover:text-purple-700 font-medium">
                Privacy Policy
              </Link>
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded mt-6"
          >
            {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </Button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-gray-700">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-gray-900 font-bold hover:text-purple-600">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
}
