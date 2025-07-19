import { HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { messageKey } from 'src/constants/message.constants';

export const handleError = async (res: Response, err: any) => {
  let message = [err.message];
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(
      (error: any) => error.message || error,
    );
  } else if (err.code === 11000) {
    const duplicateField = Object.keys(err.keyValue).join(', ');
    message = [`Duplicate value found for: ${duplicateField}`];
  } else if (err.name === 'CastError' && err.kind === 'ObjectId') {
    err.statusCodes = HttpStatus.BAD_REQUEST;
    message = [messageKey.invalidId];
  }
  res.status(err.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR).json({
    status: true,
    data: null,
    message: message.join(', '),
  });
};
