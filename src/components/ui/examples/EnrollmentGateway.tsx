import EnrollmentGateway from '../EnrollmentGateway';

export default function EnrollmentGatewayExample() {
  const mockCourseInfo = {
    title: "Advanced React Development",
    description: "Master advanced React patterns, performance optimization, and modern development practices. Build production-ready applications with confidence.",
    instructor: "Sarah Johnson",
    rating: 4.8,
    students: 15420,
    duration: "12 hours",
    price: 49,
    originalPrice: 99
  };

  const handleLogin = async (email: string, password: string) => {
    console.log('Login:', email, password);
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    console.log('Signup:', email, password, name);
  };

  const handleSocialLogin = (provider: string) => {
    console.log('Social login:', provider);
  };

  return (
    <EnrollmentGateway
      courseInfo={mockCourseInfo}
      onLogin={handleLogin}
      onSignup={handleSignup}
      onSocialLogin={handleSocialLogin}
    />
  );
}