export interface JWTPayLoadDTO {
  _id: string;
  email: string;
}

export interface BaseListQueryParamDTO {
  pageNum: number;
  pageLimit: number;
}

export interface AuditFieldDTO {
  createdAt: Date;
  updateAt: Date;
}
