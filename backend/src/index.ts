import { Hono } from 'hono'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'


const app = new Hono<{
  Bindings: {
    DATABASE_URL: string
    JWT_SECRET: string
  }
}>()

app.use('/message/*', async (c, next) => {
  const header = c.req.header("authorization") || ""
  const token = header.split(" ")[1]
  const response = await verify(token, c.env.JWT_SECRET)
  if (response.id) {
    next()
  }
  else {
    c.status(403)
    return c.json({ error: "unauthorized" })
  }
})

app.post('/api/vi/signup', async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

const body = await c.req.json();

const user = await prisma.user.create({
  data: {
    email: body.email,
    password: body.password,
  },
})

  const token = await sign({id: user.id}, c.env.JWT_SECRET)

  return c.json({
    jwt: token
  })
})

app.post('/api/v1/signin', async (c) => {
	const prisma = new PrismaClient({
		datasourceUrl: c.env?.DATABASE_URL,
	}).$extends(withAccelerate());

	const body = await c.req.json();
	const user = await prisma.user.findUnique({
		where: {
			email: body.email,
      password: body.password
		}
	});

	if (!user) {
		c.status(403);
		return c.json({ error: "user not found" });
	}

	const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
	return c.json({ jwt });
})

app.post('/api/vi/blog', (c) => {
  return c.text('Hello Hono!')
})

app.put('/api/vi/blog', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/vi/blog/:id', (c) => {
  return c.text('Hello Hono!')
})

export default app
