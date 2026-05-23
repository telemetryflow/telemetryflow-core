/**
 * Global dayjs setup — UTC + timezone plugins.
 * Import this once in main.ts so every `import dayjs from 'dayjs'` has the
 * plugins available automatically.
 */

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export default dayjs;
