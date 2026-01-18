export const analyzeCanvas = async (
  base64Image: string, 
  topicA: string, 
  topicB: string
): Promise<string> => {
  // On appelle l'URL locale de Netlify Functions
  const response = await fetch('/.netlify/functions/analyze', {
    method: 'POST',
    body: JSON.stringify({ base64Image, topicA, topicB }),
  });

  if (!response.ok) throw new Error("Network response was not ok");
  
  const data = await response.json();
  return data.text || "Unable to generate analysis.";
};