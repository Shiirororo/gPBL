import { redirect } from "next/navigation";

export default function HomePage() {
  // Tạm chuyển thẳng tới đăng nhập cho đến khi có kiểm tra phiên người dùng ở server.
  redirect("/login");
}
