const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iunvvotgvhchomysqbzy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1bnZ2b3RndmhjaG9teXNxYnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5ODA2NjAsImV4cCI6MjA5NDU1NjY2MH0._vrJZKhi1V1s3s9IR3Ht1BBYvVMlJ8wHJPe019FaHdw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function upgradeAdmin() {
  console.log("Đăng nhập bằng tài khoản urbantreehcmc@gmail.com...");
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'urbantreehcmc@gmail.com',
    password: '123456',
  });

  if (authError) {
    console.error("Lỗi đăng nhập:", authError.message);
    return;
  }
  
  console.log("Đăng nhập thành công! Bắt đầu nâng cấp quyền...");
  
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({ 
        role: 'admin',
        status: 'active'
    })
    .eq('id', authData.user.id);

  if (updateError) {
    console.error("Lỗi nâng cấp quyền:", updateError.message);
  } else {
    console.log("✅ Cấp quyền Admin Tối Cao thành công!");
  }
}

upgradeAdmin();
