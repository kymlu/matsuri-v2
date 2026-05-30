import Button from "../components/basic/Button";

export default function AdminPage() {
  return <div className="w-full space-y-2 text-center h-svh">
    <p>ログイン成功!</p>
    <Button
      onClick={() => {
        window.location.href = "/";
      }}>
      ホームページに戻る
    </Button>
  </div>;
}