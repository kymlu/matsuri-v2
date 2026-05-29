import { useEffect } from "react";

export default function AdminPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "/";
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return <div className="w-full h-full text-center">
    <p>ログイン成功!</p>
    <p>3秒後ホームページに戻ります。</p>
  </div>;
}