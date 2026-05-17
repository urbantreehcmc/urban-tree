const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iunvvotgvhchomysqbzy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1bnZ2b3RndmhjaG9teXNxYnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5ODA2NjAsImV4cCI6MjA5NDU1NjY2MH0._vrJZKhi1V1s3s9IR3Ht1BBYvVMlJ8wHJPe019FaHdw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdmin() {
  console.log("Đang tạo tài khoản urbantreehcmc@gmail.com...");
  
  const { data, error } = await supabase.auth.signUp({
    email: 'urbantreehcmc@gmail.com',
    password: '123456',
    options: {
      data: {
        full_name: 'Sở Xây Dựng TP.HCM',
      }
    }
  });

  if (error) {
    if (error.message.includes('User already registered')) {
        console.log("Tài khoản này đã được đăng ký từ trước.");
    } else {
        console.error("Lỗi đăng ký:", error.message);
    }
  } else {
    console.log("✅ Đăng ký Auth thành công!");
    console.log("UserID:", data.user?.id);
  }
}

createAdmin();
