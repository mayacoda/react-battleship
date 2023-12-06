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
    <div
      className="flex justify-center items-center h-screen"
      style={{
        backgroundImage: `
        linear-gradient(
  0deg,
  hsl(306deg 100% 83%) 0%,
  hsl(294deg 100% 83%) 11%,
  hsl(282deg 100% 83%) 22%,
  hsl(270deg 100% 83%) 33%,
  hsl(258deg 100% 82%) 44%,
  hsl(247deg 100% 82%) 56%,
  hsl(235deg 100% 82%) 67%,
  hsl(223deg 100% 82%) 78%,
  hsl(211deg 100% 82%) 89%,
  hsl(199deg 100% 81%) 100%
)`,
      }}
    >
      <Card>
        <CardHeader>
          <h1 className="text-2xl">Join React Battleship</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Input
              type="text"
              className="mb-3"
              autoComplete="off"
              placeholder="What do we call you?"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Button type="submit" className="w-full">
              Onwards! ⛵️
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
