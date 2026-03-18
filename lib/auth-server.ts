import { google } from 'googleapis';
import { GOOGLE_CLIENT_ID, REDIRECT_URI } from './config';

export const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

export const COOKIE_NAME = 'pfe_refresh_token';
