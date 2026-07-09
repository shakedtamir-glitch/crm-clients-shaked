export function milestoneEmailHtml(params: {
  clientName: string;
  month: number;
  totalTime: string;
  startDate: string;
  program: string;
  status: string;
  profileUrl: string;
}) {
  const { clientName, month, totalTime, startDate, program, status, profileUrl } = params;

  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #17171a;">
      <h2 style="margin-bottom: 4px;">${clientName} has just entered Month ${month} of coaching.</h2>
      <table style="width: 100%; margin-top: 16px; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 0; color: #71717a;">Client Name</td><td style="padding: 6px 0; font-weight: 600;">${clientName}</td></tr>
        <tr><td style="padding: 6px 0; color: #71717a;">Current Coaching Month</td><td style="padding: 6px 0; font-weight: 600;">Month ${month}</td></tr>
        <tr><td style="padding: 6px 0; color: #71717a;">Total Time Since Start</td><td style="padding: 6px 0; font-weight: 600;">${totalTime}</td></tr>
        <tr><td style="padding: 6px 0; color: #71717a;">Start Date</td><td style="padding: 6px 0; font-weight: 600;">${startDate}</td></tr>
        <tr><td style="padding: 6px 0; color: #71717a;">Program</td><td style="padding: 6px 0; font-weight: 600;">${program}</td></tr>
        <tr><td style="padding: 6px 0; color: #71717a;">Current Status</td><td style="padding: 6px 0; font-weight: 600;">${status}</td></tr>
      </table>
      <a href="${profileUrl}" style="display: inline-block; margin-top: 20px; padding: 10px 16px; background: #7c5cff; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
        View client profile
      </a>
    </div>
  `;
}
