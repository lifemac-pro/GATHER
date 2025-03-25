// "use client"; // ✅ This ensures it's a Client Component

// import { useState } from "react";
// import EventCard from "@/components/ui/EventCard";

// const FeaturedEvents = () => {
//   const handleRegister = (eventTitle: string) => {
//     alert(`You registered for ${eventTitle}!`);
//   };

//   return (
//     <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
//       {["Event 1", "Event 2", "Event 3"].map((title, index) => (
//         <EventCard
//           key={index}
//           title={title}
//           date="April 5, 2025"
//           status="Not Registered"
//           onRegister={() => handleRegister(title)} // ✅ Now it's inside a Client Component
//         />
//       ))}
//     </div>
//   );
// };

// export default FeaturedEvents;
