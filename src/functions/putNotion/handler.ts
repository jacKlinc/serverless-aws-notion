import { v4 as uuid } from 'uuid';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { Client } from "@notionhq/client";
import { Configuration, OpenAIApi } from "openai";

import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
import { dynamo } from '@libs/dynamo';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);


const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const body = event.body;
    const tableName = process.env.myTable;
    const planAspects = body; //.planAspects
    const notionPages = await processAndCreatePages([planAspects])

    const data = {
      ...notionPages,
      id: uuid(),
    };
    // save to DyanmoDB
    await dynamo.write(data, tableName);

    // send to Notion
    await sendToNotion(notionPages)

    // the OpenAI response could be returned to the frontend here or in another Lambda

    return formatJSONResponse(200, {
      message: `data is saved`,
      id: data.id,
    });
  } catch (error) {
    console.log('error', error);
    return formatJSONResponse(502, {
      message: error.message,
    });
  }
};


const sendToNotion = async (messages: string[]) => {
  const notion = new Client({
    auth: process.env.NOTION_TOKEN,
  });

  return await notion.databases.query({
    database_id: process.env.NOTION_DATABASE,
  });
  // replace this with create
};


const queryOpenAI = async (message: string) => {
  try {
    return await openai.createChatCompletion({
      model: "gpt-4-1106-preview",
      messages: message
    });
  } catch (error) {
    console.log('error', error);
  }
};

const createNotionPage = async (message: string): Promise<string> => {
  try {
    // queryAPI    
    const openAIResponse = await queryOpenAI(message)

    // const response = do something with the messsage
    // queryNotion
    return openAIResponse
  } catch (error) {
    console.log('error', error);
  }
};


const processAndCreatePages = async (planAspects: string[]): Promise<string[]> => {
  try {
    const messages = planAspects // some filter function
    return Promise.all(messages.map((m) => createNotionPage(m)))
  } catch (error) {
    console.log('error', error);
  }
};

export const main = middyfy(handler);
