import { parseGoogleCalendarOAuthReturn } from './google-calendar-oauth-return.service';

describe('parseGoogleCalendarOAuthReturn', () => {
  it('accepts a known Android callback result', () => {
    expect(parseGoogleCalendarOAuthReturn('com.ionic.haven://calendar/oauth-return?result=connected')).toBe(
      'connected',
    );
    expect(parseGoogleCalendarOAuthReturn('com.ionic.haven://calendar/oauth-return?result=cancelled')).toBe(
      'cancelled',
    );
  });

  it('rejects other destinations and URLs containing OAuth credentials', () => {
    expect(parseGoogleCalendarOAuthReturn('https://haven.example/calendar/oauth-return?result=connected')).toBeNull();
    expect(parseGoogleCalendarOAuthReturn('com.ionic.haven://other/oauth-return?result=connected')).toBeNull();
    expect(parseGoogleCalendarOAuthReturn('com.ionic.haven://calendar/other?result=connected')).toBeNull();
    expect(parseGoogleCalendarOAuthReturn('com.ionic.haven://calendar/oauth-return?result=unknown')).toBeNull();
    expect(
      parseGoogleCalendarOAuthReturn('com.ionic.haven://calendar/oauth-return?result=connected&code=secret'),
    ).toBeNull();
    expect(
      parseGoogleCalendarOAuthReturn('com.ionic.haven://calendar/oauth-return?result=connected&state=secret'),
    ).toBeNull();
    expect(parseGoogleCalendarOAuthReturn('not a URL')).toBeNull();
  });
});
