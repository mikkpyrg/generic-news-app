/*
chcp 1257
chcp 65001
psql -f server.sql -U postgres
psql -U postgres -d news
*/
DROP DATABASE IF EXISTS news;
CREATE DATABASE news ENCODING 'UTF8';

\c news;

CREATE TABLE provider (
  id SERIAL PRIMARY KEY,
  name text,
  logintype text,
  description text,
  reauthtime integer,
  articlescript text,
  categories text,
  clientid text not null,
  clientsecret text not null,
  deletedate timestamp,
  CONSTRAINT clientid UNIQUE (clientid)
);

CREATE TABLE oauth (
  id SERIAL PRIMARY KEY,
  clientid text,
  clientsecret text,
  authorizeendpoint text,
  tokenendpoint text,
  logoutendpoint text,
  profileendpoint text,
  profileemailkey text,
  profileidkey text,
  profilenamekey text,
  permissionsendpoint text,
  permissionskey text,
  permissionkey text,
  scope text,
  deletedate timestamp
);

CREATE TABLE provider_user (
  id SERIAL PRIMARY KEY,
  provider integer references provider(id),
  email text,
  name text,
  permissions text,
  clientid text not null,
  deletedate timestamp,
  CONSTRAINT provider_client UNIQUE (provider,clientid)
);

CREATE TABLE session (
  id SERIAL PRIMARY KEY,
  provider_user integer references provider_user(id),
  token text,
  reauthtime integer,
  refreshdate timestamp
);

CREATE TABLE article (
  id SERIAL PRIMARY KEY,
  provider integer references provider(id),
  clientid text,
  url text,
  category text,
  published timestamp,
  title text,
  mainpicture text,
  summary text,
  paragraphs json,
  permissions text,
  deletedate timestamp,
  CONSTRAINT provider_article UNIQUE (provider,clientid)
);

CREATE TABLE user_article (
  id SERIAL PRIMARY KEY,
  article integer references article(id),
  provider_user integer references provider_user(id),
  deletedate timestamp,
  CONSTRAINT unique_like UNIQUE (article,provider_user)
);