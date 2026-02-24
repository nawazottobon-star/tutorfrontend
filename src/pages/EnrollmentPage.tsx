import EnrollmentGateway from '@/components/EnrollmentGateway';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { useLocation } from 'wouter';

export default function EnrollmentPage() {
  const [, setLocation] = useLocation();

  const courseInfo = {
    title: "AI in Web Development",
    description: "Master the art of integrating AI into your web applications with this comprehensive guide to LLMs, RAG, and more.",
    instructor: "Jane Smith",
    rating: 4.8,
    students: 12500,
    duration: "12 weeks",
    price: 49,
    originalPrice: 99
  };

  const handleLogin = (email: string) => {
    console.log('Login successful for:', email);
    setLocation('/tutors'); // Redirect for now
  };

  const handleSignup = (email: string) => {
    console.log('Signup successful for:', email);
    setLocation('/tutors');
  };

  const handleSocialLogin = (provider: string) => {
    console.log('Social login with:', provider);
  };

  return (
    <SiteLayout>
      <EnrollmentGateway
        courseInfo={courseInfo}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onSocialLogin={handleSocialLogin}
      />
    </SiteLayout>
  );
}
