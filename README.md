# QlikSense deploy

*This is to be used with [qliksense-template](https://github.com/ahmednuaman/qliksense-template) or [qliksense-extension](https://github.com/ahmednuaman/qliksense-extension)!*

## How to use
`HOST=http://qliksense-host/static_user/qrs/ USERID=QRS-USER MASHUP=yes qliksense-deploy`

Environment variable `MASHUP` is optional, but if it is defined then you need to ensure your `package.json` includes:

```
"deploy": {
  "id": "mashup-unique-id", // usually same as package.json's name
  "cdn": "mashup_unique_id_content" // same as id except snake case with _content at the end
}
```
