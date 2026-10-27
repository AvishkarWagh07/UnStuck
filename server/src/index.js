import 'dotenv/config';
import app from './app.js';
import { connectDb } from './config/db.js';
import { isAiEnabled } from './services/geminiService.js';

const port = process.env.PORT || 5050;

const mode = await connectDb(process.env.MONGO_URI);

app.listen(port, () => {
  console.log('[server] listening on http://localhost:' + port);
  console.log('[server] database mode:', mode);
  console.log(
    '[server] step generator:',
    isAiEnabled() ? 'enabled (Gemini)' : 'no GEMINI_API_KEY set, dynamic steps will be refused'
  );
});
