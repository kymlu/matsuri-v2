import { useEffect } from "react";
import Button from "../components/basic/Button";

export default function AdminPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return <div className="w-full h-full text-center">
    <p>ログイン成功!</p>
    <Button
      onClick={() => {
        window.location.href = "/";
      }}>
      ホームページに戻る
    </Button>
  </div>;
}