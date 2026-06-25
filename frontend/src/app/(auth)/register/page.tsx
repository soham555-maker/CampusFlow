"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

const schema = z.object({
  full_name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "teacher"]),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "student" },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { role: data.role, full_name: data.full_name },
      },
    });
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <div className="glass-panel rounded-2xl p-8 border border-white/10 text-center">
        <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-green-400 text-xl">✓</span>
        </div>
        <h2 className="text-xl font-semibold text-white">Check your email</h2>
        <p className="text-gray-400 text-sm mt-2">
          We sent a confirmation link to your inbox.
        </p>
        <Link
          href="/login"
          className="inline-block mt-5 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-8 border border-white/10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white tracking-tight">
          Create account
        </h1>
        <p className="text-gray-400 text-sm mt-1">Join CampusFlow</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Full Name</label>
          <input
            {...register("full_name")}
            type="text"
            placeholder="Jane Doe"
            className="input-glass"
          />
          {errors.full_name && (
            <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Email</label>
          <input
            {...register("email")}
            type="email"
            placeholder="you@college.edu"
            className="input-glass"
          />
          {errors.email && (
            <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Password</label>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className="input-glass"
          />
          {errors.password && (
            <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Role</label>
          <select {...register("role")} className="input-glass">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button type="submit" loading={isSubmitting} className="w-full mt-2">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-400 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
          Sign In
        </Link>
      </p>
    </div>
  );
}
