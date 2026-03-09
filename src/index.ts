import { Hono } from 'hono'

const app = new Hono()
app.post('api/v1/signup',(c)=>c.text("what is this "))
app.post('api/v1/signin',(c)=>c.text("what is this "))
app.post('api/v1/blog',(c)=>c.text("what is this "))
app.put('api/v1/blog',(c)=>c.text("what is this "))
app.get('api/v1/blog/:id',(c)=>c.text("what is this "))

export default app
