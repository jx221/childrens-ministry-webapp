import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

const PC_APP_ID          = defineSecret('PC_APP_ID');
const PC_SECRET          = defineSecret('PC_SECRET');
const PC_SERVICE_TYPE_ID = defineSecret('PC_SERVICE_TYPE_ID');
const PC_TEAM_ID         = defineSecret('PC_TEAM_ID');
const SLACK_WEBHOOK_URL  = defineSecret('SLACK_WEBHOOK_URL');

const PC_BASE = 'https://api.planningcenteronline.com/services/v2';

async function pcGet(path: string, appId: string, secret: string): Promise<any> {
  const auth = Buffer.from(`${appId}:${secret}`).toString('base64');
  const res = await fetch(`${PC_BASE}${path}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) throw new Error(`Planning Center ${res.status}: ${await res.text()}`);
  return res.json();
}

async function sendScheduleToSlack(
  appId: string, secret: string,
  serviceTypeId: string, teamId: string,
  slackUrl: string
): Promise<string> {
  // 1. Get next upcoming plan
  const plansData = await pcGet(
    `/service_types/${serviceTypeId}/plans?filter=future&per_page=1&order=sort_date`,
    appId, secret
  );

  if (!plansData.data?.length) return 'No upcoming plans found.';

  const plan      = plansData.data[0];
  const planId    = plan.id as string;
  const planDates = plan.attributes.dates as string ?? 'Upcoming Sunday';

  // 2. Get team members for the plan, filtered to our team
  const teamData = await pcGet(
    `/service_types/${serviceTypeId}/plans/${planId}/team_members?per_page=100`,
    appId, secret
  );

  const members: any[] = teamData.data ?? [];
  const serving = members.filter(m =>
    m.relationships?.team?.data?.id === teamId &&
    m.attributes.status !== 'Declined'
  );

  // 3. Build Slack message
  const roster = serving.length === 0
    ? '_No one scheduled yet_'
    : serving.map(m => {
        const name     = m.attributes.name as string;
        const position = (m.attributes.team_position_name as string) || 'Team Member';
        const check    = m.attributes.status === 'Confirmed' ? '✅' : '⏳';
        return `${check} *${name}* — ${position}`;
      }).join('\n');

  const message = {
    text: `📅 *Children's Ministry — ${planDates}*\n\n${roster}\n\n_See you Sunday!_ ⛪`,
  };

  // 4. Post to Slack
  const slackRes = await fetch(slackUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  if (!slackRes.ok) throw new Error(`Slack error: ${slackRes.status}`);
  return `Sent schedule for ${planDates}`;
}

// ── Scheduled: every Saturday at 6pm EST ──
export const sendWeeklySchedule = onSchedule(
  {
    schedule: '0 18 * * 6',
    timeZone: 'America/New_York',
    secrets: [PC_APP_ID, PC_SECRET, PC_SERVICE_TYPE_ID, PC_TEAM_ID, SLACK_WEBHOOK_URL],
  },
  async () => {
    const result = await sendScheduleToSlack(
      PC_APP_ID.value(), PC_SECRET.value(),
      PC_SERVICE_TYPE_ID.value(), PC_TEAM_ID.value(),
      SLACK_WEBHOOK_URL.value()
    );
    logger.info(result);
  }
);

// ── Manual trigger: callable from the app ──
export const triggerScheduleMessage = onCall(
  {
    secrets: [PC_APP_ID, PC_SECRET, PC_SERVICE_TYPE_ID, PC_TEAM_ID, SLACK_WEBHOOK_URL],
  },
  async () => {
    const result = await sendScheduleToSlack(
      PC_APP_ID.value(), PC_SECRET.value(),
      PC_SERVICE_TYPE_ID.value(), PC_TEAM_ID.value(),
      SLACK_WEBHOOK_URL.value()
    );
    return { message: result };
  }
);
