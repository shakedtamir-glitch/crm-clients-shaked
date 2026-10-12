export function completionEmailHtml(params: {
  clientName: string;
  program: string;
  startDate: string;
  endDate: string;
  profileUrl: string;
}) {
  const { clientName, program, startDate, endDate, profileUrl } = params;

  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #17171a;">
      <h2 style="margin-bottom: 4px;">${clientName} has completed their coaching program.</h2>
      <table style="width: 100%; margin-top: 16px; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 0; color: #71717a;">Client Name</td><td style="padding: 6px 0; font-weight: 600;">${clientName}</td></tr>
        <tr><td style="padding: 6px 0; color: #71717a;">Program</td><td style="padding: 6px 0; font-weight: 600;">${program}</td></tr>
        <tr><td style="padding: 6px 0; color: #71717a;">Start Date</td><td style="padding: 6px 0; font-weight: 600;">${startDate}</td></tr>
        <tr><td style="padding: 6px 0; color: #71717a;">End Date</td><td style="padding: 6px 0; font-weight: 600;">${endDate}</td></tr>
      </table>
      <a href="${profileUrl}" style="display: inline-block; margin-top: 20px; padding: 10px 16px; background: #7c5cff; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
        View client profile
      </a>
    </div>
  `;
}
