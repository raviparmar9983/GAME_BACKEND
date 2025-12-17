export interface JWTPayLoadDTO {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  profilePic?: string;
  birthDate?: Date;
}

export interface BaseListQueryParamDTO {
  pageNum: number;
  pageLimit: number;
}

export interface AuditFieldDTO {
  createdAt: Date;
  updateAt: Date;
}
