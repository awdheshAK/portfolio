export const metadata = { title: 'Report content' };

export default function ReportInfoPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Report content</h1>
      <p className="text-sm text-surface-500 leading-relaxed">
        To report a specific video, open the video&apos;s watch page and click the flag icon next to the download
        button. Your report is sent directly to our moderation team, who review flagged content and take action -
        including removing videos or suspending accounts - in line with our Terms of Use.
      </p>
    </div>
  );
}
