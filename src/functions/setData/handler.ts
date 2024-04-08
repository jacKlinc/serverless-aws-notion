import { v4 as uuid } from 'uuid';
import { APIGatewayProxyEvent } from 'aws-lambda';

import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';
import { dynamo } from '@libs/dynamo';

const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const body = event.body;
    const tableName = process.env.myTable;

    const data = {
      ...body, // TODO: why does error
      id: uuid(),
    };
    await dynamo.write(data, tableName);

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

export const main = middyfy(handler);
