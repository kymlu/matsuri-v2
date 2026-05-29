import { useEffect } from "react";

export default function AdminPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return <div>ログイン成功</div>;
}