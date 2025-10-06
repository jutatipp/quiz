"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AuthService from "@/libs/AuthService";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("่jutatip.ph");   // ค่าเริ่มต้นทดสอบ
  const [password, setPassword] = useState("123456"); // ค่าเริ่มต้นทดสอบ
  const [error, setError] = useState("");

  // ถ้าล็อกอินค้างไว้แล้วให้เด้งไป /feed
  useEffect(() => {
    const raw = localStorage.getItem("appUser");
    if (raw) router.replace("/feed");
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const { user, token } = await AuthService.login(username.trim(), password.trim());
      localStorage.setItem("appUser", JSON.stringify(user));
      if (token) localStorage.setItem("appToken", token);
      router.push("/feed");
    } catch (err: any) {
      setError(err.message || "เข้าสู่ระบบไม่สำเร็จ");
    }
  };

  return (
    <Card sx={{ maxWidth: 420, mx: "auto", mt: 6 }}>
      <CardContent>
        <Typography variant="h5" fontWeight={700} mb={2}>เข้าสู่ระบบ</Typography>
        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              autoComplete="username"
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              autoComplete="current-password"
            />
            {error && <Typography color="error">{error}</Typography>}
            <Button type="submit" variant="contained">Login</Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
