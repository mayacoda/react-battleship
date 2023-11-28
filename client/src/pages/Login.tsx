import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";

type Props = {
  onLogin: (username: string) => void;
};

export function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onLogin(username);
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Card>
        <CardHeader>
          <h1 className="text-2xl">Login</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Input
              type="text"
              className="mb-3"
              autoComplete="off"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
