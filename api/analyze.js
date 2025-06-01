import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { image } = req.body;
  if (!image) {
    res.status(400).json({ error: 'No image provided' });
    return;
  }

  try {
    const response = await openai.createImageVariation({
      image: image.split(',')[1],
      n: 1,
      size: '512x512',
      response_format: 'url'
    });

    const description = response.data.data[0].url;
    res.status(200).json({ description });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}