"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Lock, Phone, Building2, Camera } from "lucide-react";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "attendee",
    organizationName: "",
    profileImage: "",
  });

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      setTimeout(() => {
        setPreview(reader.result as string);
        setFormData((prev) => ({ ...prev, profileImage: reader.result as string }));
        setUploading(false);
      }, 800);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      alert("Signup successful!");
    } else {
      alert("Signup failed!");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 rounded-2xl mb-4">
            <User className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome
          </h1>
          <p className="text-slate-500">
            Create your account to get started
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Profile Photo */}
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={preview || ""} alt="Profile" />
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-xl">
                      {formData.name ? formData.name.charAt(0).toUpperCase() : <User className="w-8 h-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <Label
                    htmlFor="image-upload"
                    className="absolute bottom-0 right-0 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors shadow-md"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 text-sm font-medium">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="h-11 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="h-11 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-11 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 text-sm font-medium">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  className="h-11 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label className="text-slate-700 text-sm font-medium">Role</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="h-11 border-slate-200 focus:border-slate-900 focus:ring-slate-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="attendee">Attendee</SelectItem>
                    <SelectItem value="organizer">Organizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Organization (conditional) */}
              {formData.role === "organizer" && (
                <div className="space-y-2">
                  <Label htmlFor="organizationName" className="text-slate-700 text-sm font-medium">
                    Organization
                  </Label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    placeholder="Your company name"
                    value={formData.organizationName}
                    onChange={handleChange}
                    className="h-11 border-slate-200 focus:border-slate-900 focus:ring-slate-900"
                  />
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium mt-6"
                disabled={uploading}
              >
                {uploading ? "Creating account..." : "Create account"}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{" "}
              <a href="/login" className="text-slate-900 font-medium hover:underline">
                Sign in
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}