// import React from 'react';
// import { cn } from '../lib/utils';

// function formatMessageTime(ts) {
//   if (!ts) return '';
//   const d = new Date(ts);
//   return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
// }

// const ChatBubble = ({
//   message,
//   timestamp,
//   isCurrentUser,
//   status = 'sent',
//   className,
// }) => (
//   <div className={cn(
//     "flex",
//     isCurrentUser ? "justify-end" : "justify-start",
//     className
//   )}>
//     <div
//       className={cn(
//         "relative px-4 py-2 rounded-2xl shadow",
//         isCurrentUser
//           ? "bg-[#6b493d] text-[#ffd8b8] rounded-br-sm"
//           : "bg-[#f8f4ed] text-[#2c1810] rounded-bl-sm",
//         "max-w-[80%] sm:max-w-[60%] break-words whitespace-pre-line",
//         "text-sm sm:text-base"
//       )}
//       style={{
//         wordBreak: "break-word",
//         overflowWrap: "break-word",
//         whiteSpace: "pre-line"
//       }}
//     >
//       <span className="font-body">{message}</span>
//       <div className="text-xs mt-1 text-[#a07855]/80 text-right">
//         {formatMessageTime(timestamp)}
//         {isCurrentUser && (
//           <span className="ml-2">
//             {status === 'read' ? (
//               <span className="text-[#ffd8b8]">✓✓</span>
//             ) : status === 'delivered' ? (
//               <span className="text-[#a07855]/80">✓✓</span>
//             ) : (
//               <span className="text-[#a07855]/80">✓</span>
//             )}
//           </span>
//         )}
//       </div>
//     </div>
//   </div>
// );

// export default ChatBubble;

import React from 'react';
import { cn } from '../lib/utils';

function formatMessageTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ChatBubble = ({
  message,
  timestamp,
  isCurrentUser,
  status = 'sent',
  className,
}) => (
  <div className={cn(
    "flex mb-3",
    isCurrentUser ? "justify-end" : "justify-start",
    className
  )}>
    <div
      className={cn(
        "relative px-4 py-3 rounded-2xl",
        isCurrentUser
          ? "bg-[#6b493d] text-[#ffd8b8] rounded-br-sm"
          : "bg-[#f0e8db] text-[#2c1810] rounded-bl-sm",
        "max-w-[85%] break-words whitespace-pre-line",
        "text-base shadow-sm"
      )}
      style={{
        wordBreak: "break-word",
        overflowWrap: "break-word",
      }}
    >
      <p className="font-body leading-snug">{message}</p>
      
      <div className={cn(
        "flex items-center mt-1.5 text-xs",
        isCurrentUser 
          ? "text-[#ffd8b8]/90 justify-end" 
          : "text-[#2c1810]/70 justify-start"
      )}>
        <span>{formatMessageTime(timestamp)}</span>
        {isCurrentUser && (
          <span className="ml-1.5">
            {status === 'read' ? (
              <span className="text-[#ffd8b8]">✓✓</span>
            ) : status === 'delivered' ? (
              <span className="text-[#ffd8b8]/70">✓✓</span>
            ) : (
              <span className="text-[#ffd8b8]/70">✓</span>
            )}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default ChatBubble;