// // AdminLayout.tsx
// import React from 'react';
// import Sidebar from './sidebar';
// import Navbar from './header';

// interface AdminLayoutProps {
//   children: React.ReactNode;
// }

// export default function AdminLayout({ children }: AdminLayoutProps) {
//   return (
//     <div style={{ display: 'flex', minHeight: '100vh' }}>
//       <Sidebar userRole="admin" />
//       <div style={{ flex: 1 }}>
//         <Navbar />
//         <main style={{ padding: '1rem' }}>{children}</main>
//       </div>
//     </div>
//   );
// }
