import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, prompt } = req.body;
  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    const base64Data = image.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `${prompt} してください。` },
            { type: 'image', image: buffer },
          ],
        },
      ],
    });

    const description = response.choices[0].message.content;
    res.status(200).json({ description });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}