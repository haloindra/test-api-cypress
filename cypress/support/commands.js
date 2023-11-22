Cypress.Commands.add("resetUsers", () => {
  cy.request("DELETE", "http://localhost:3000/Auth/reset");
})

Cypress.Commands.add("badRequest", (response, message = []) => {
  expect(response.status).to.eq(400);
  expect(response.body.error).to.eq("Bad Request");
  message.forEach((message) => {
    expect(message).to.be.oneOf(response.body.message);
  })
})

Cypress.Commands.add("unauthorized", (response) => {
  expect(response.status).to.eq(401);
  expect(response.body.message).to.eq("Unauthorized");
})

Cypress.Commands.add("checkUnauthorized", (method, url) => {
  cy.request({
    method,
    url,
    headers: {
      Authorization: null,
    },
    failOnStatusCode: false,
  }).then((response) => {
    cy.unauthorized(response);
  })
})

Cypress.Commands.add("login", () => {
  const userData = {
    name: "John Doe",
    email: "john@nest.test",
    password: "Secret_123",
  };

  cy.resetUsers();
  cy.request({
    method: "POST",
    url: "/Auth/register",
    body: userData,
  })

  cy.request({
    method: "POST",
    url: "/auth/login",
    failOnStatusCode: true,
    body: {
      email: userData.email,
      password: userData.password,
    },
  }).then((response) => {
    Cypress.env("token", response.body.data.access_token);
  })
})

Cypress.Commands.add("generatePostsData", (count) => {
  const { faker } = require("@faker-js/faker");

  cy.writeFile(
    "cypress/fixtures/posts.json",
    Cypress._.times(count, () => {
      return {
        title: faker.lorem.words(3),
        content: faker.lorem.paragraphs(),
      };
    })
  );
})

Cypress.Commands.add("deletePostsData", () => {
  cy.request({
    method: "DELETE",
    url: "/posts/reset",
    headers: {
      authorization: `Bearer ${Cypress.env("token")}`,
    },
  })
})

Cypress.Commands.add("createPost", (data = []) => {
  cy.login();
  // reset posts data
  cy.deletePostsData();
  data.forEach((_post) => {
    // create posts
    cy.request({
      method: "POST",
      url: "/posts",
      headers: {
        authorization: `Bearer ${Cypress.env("token")}`,
      },
      body: _post,
    })
  })
})

Cypress.Commands.add("generateCommentsData", (count) => {
  const { faker } = require('@faker-js/faker')

  cy.request({
    method: "DELETE",
    url: '/comments/reset',
    headers: {
      authorization: `Bearer ${Cypress.env("token")}`,
    },
  })

  cy.generatePostsData(3);
  cy.fixture('posts').then(posts => cy.createPost(posts));

  cy.writeFile('cypress/fixtures/comments.json',
    Cypress._.times(count, () => {
      return {
        post_id: faker.datatype.number({ min: 1, max: 3 }),
        content: faker.lorem.words(5),
      }
    }))
})
