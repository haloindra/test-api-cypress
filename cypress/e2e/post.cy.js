const { update } = require("lodash");

describe("Post Module", () => {
  const dataCount = 15;
  const randomId = Cypress._.random(16, 100);

  before("login", () => {
    cy.login()
  })

  before("generate posts data", () => {
    cy.generatePostsData(dataCount);
  })

  describe("Create Post", () => {
    /*  
    1. return unauthorized 
    2. return error validation message
    3. return correct post
   */

    it("should return unauthorized", () => {
      cy.checkUnauthorized("POST", "/posts");
    })

    it("should return error validation message", () => {
      cy.request({
        method: "POST",
        url: "/posts",
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.badRequest(response, [
          "title must be a string",
          "content must be a string",
        ])
      })
    })

    it("should return correct post", () => {
      cy.fixture("posts").then((postsData) => {
        cy.request({
          method: "POST",
          url: "/posts",
          headers: {
            authorization: `Bearer ${Cypress.env("token")}`,
          },
          body: {
            title: postsData[0].title,
            content: postsData[0].content,
          },
        }).then((response) => {
          const {
            success,
            data: { title, content, comments },
          } = response.body;
          expect(response.status).to.eq(201);
          expect(success).to.be.true;
          expect(title).to.eq(postsData[0].title);
          expect(content).to.eq(postsData[0].content);
          expect(comments.length).to.eq(0);
        })
      })
    })
  })

  describe("Get All Posts", () => {
    /* 
    1. Return unauthorized
    2. return correct count and data
    */

    it("should return unauthorized", () => {
      cy.checkUnauthorized("GET", "/posts");
    })

    it("should return correct count and data", () => {
      cy.fixture("posts").then((postsData) => {
        // reset posts data
        cy.deletePostsData();
        //create post data
        cy.createPost(postsData);
        //get all posts
        cy.request({
          method: "GET",
          url: "/posts",
          headers: {
            authorization: `Bearer ${Cypress.env("token")}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.success).to.true;
          expect(response.body.data.length).to.be.eq(postsData.length);

          postsData.forEach((_post, index) => {
            expect(response.body.data[index].id).to.eq(index + 1);
            expect(response.body.data[index].title).to.eq(_post.title);
            expect(response.body.data[index].content).to.eq(_post.content);
          })
        })
      })
    })
  })

  describe("Get by ID", () => {
    /*
    1. return unauthorized
    2. return correct data
    3. return not found error when id data is missmatch
    */
    it("should return unauthorized", () => {
      cy.checkUnauthorized("GET", "/posts/9999");
    })

    it("sould return correct data", () => {
      cy.fixture('posts').then((postsData) => {
        postsData.forEach((_post, index) => {
          cy.request({
            method: 'GET',
            url: `/posts/${index + 1}`,
            headers: { authorization: `Bearer ${Cypress.env("token")}` },
          }).then((response) => {
            const { title, content } = response.body.data
            expect(response.status).to.be.ok
            expect(title).to.eq(_post.title)
            expect(content).to.eq(_post.content)
          })
        })
      })
    })

    it("Should Return Error when id data is missmatch", () => {
      cy.fixture("posts").then((postsData) => {
        postsData.forEach((_post) => {
          cy.request({
            method: "GET",
            url: `/posts/${randomId}`,
            headers: {
              authorization: `Bearer ${Cypress.env("token")}`,
            },
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(404);
            expect(response.body.success).to.be.false;
            expect(response.body.data).to.be.null
          })
        })
      })
    })
  })

  describe("Update Post", () => {
    /* 
    1. Check unauthorized
    2. return not found id
    3. return error validation when data is null
    4. return correct updated post    
    */

    it("should return unauthorized", () => {
      cy.checkUnauthorized("PATCH", "/posts/9999");
    })

    it("should return not found id", () => {
      cy.fixture("posts").then((postsData) => {
        postsData.forEach((_post) => {
          cy.request({
            method: "PATCH",
            url: `/posts/${randomId}`,
            headers: {
              authorization: `Bearer ${Cypress.env("token")}`,
            },
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(404);
            expect(response.body.success).to.be.false;
            expect(response.body.data).to.be.null
          })
        })
      })
    })

    it("should return error validation message", () => {
      cy.fixture("posts").then((postsData) => {
        postsData.forEach((_post) => {
          cy.request({
            method: "PATCH",
            url: `/posts/${randomId}`,
            headers: {
              authorization: `Bearer ${Cypress.env("token")}`,
            },
            failOnStatusCode: false,
            body: {
              body: true,
              content: randomId
            },
          }).then((response) => {
            cy.log({ response })
            cy.badRequest(response, ["content must be a string"])
          })
        })
      })
    })

    it("should return correct updated post", () => {
      const updatedPost = {
        id: 1,
        title: "Updated title",
        content: "Updated Post"
      }

      //updated post
      cy.request({
        method: "PATCH",
        url: `/posts/${updatedPost.id}`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
        body: {
          title: updatedPost.title,
          content: updatedPost.content
        },
        failOnStatusCode: false,
      }).then((response) => {
        const {
          success,
          data: { title, content },
        } = response.body

        expect(response.status).to.eq(200)
        expect(success).to.be.true
        expect(title).to.eq(updatedPost.title)
        expect(content).to.eq(updatedPost.content)
      })

      //check get by id data
      cy.request({
        method: 'GET',
        url: `/posts/${updatedPost.id}`,
        headers: { authorization: `Bearer ${Cypress.env("token")}` },
      }).then((response) => {
        const { title, content } = response.body.data
        expect(response.status).to.be.ok
        expect(title).to.eq(updatedPost.title)
        expect(content).to.eq(updatedPost.content)
      })

      // check get all posts
      cy.request({
        method: "GET",
        url: "/posts",
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
      }).then((response) => {
        const post = response.body.data.find(
          (_post => _post.id === updatedPost.id)
        )

        expect(post.title).to.eq(updatedPost.title)
        expect(post.content).to.eq(updatedPost.content)
      })
    })
  })

  describe("Delete Post", () => {
    /* 
    1. return unauthorized
    2. return not found
    3. succesfully remove the post
    4. not be found the deleted post
    5. succesfully reset post
    */

    it("should return unauthorized", () => {
      cy.checkUnauthorized('DELETE', '/posts/999')
    })

    it("should return not found", () => {
      cy.request({
        method: "DELETE",
        url: `/posts/${randomId}`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.success).to.be.false;
        expect(response.body.data).to.be.null
      })
    })

    it("succesfully remove the post", () => {
      cy.request({
        method: "DELETE",
        url: `/posts/1`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
      }).then((response) => {
        expect(response.status).to.be.ok
        expect(response.body.success).to.be.true
        expect(response.body.message).to.eq("Post deleted successfully")
      })
    })

    it("should not be found the deleted post", () => {
      //check get by id data
      cy.request({
        method: 'GET',
        url: `/posts/1`,
        headers: { authorization: `Bearer ${Cypress.env("token")}` },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404)
      })

      // check get all posts
      cy.request({
        method: "GET",
        url: "/posts",
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
      }).then((response) => {
        const post = response.body.data.find(
          (_post => _post.id === 1)
        )
        expect(post).to.be.undefined
      })
    })

    it("succesfully reset post", () => {
      cy.request({
        method: "DELETE",
        url: `/posts/reset`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
      }).then((response) => {
        expect(response.status).to.be.ok
        expect(response.body.success).to.be.true
        expect(response.body.message).to.eq("Reset posts successfully")
        expect(response.body.data).to.be.undefined
      })
    })

    it("should null on post", () => {
      cy.request({
        method: "GET",
        url: `/posts`,
        headers: {
          authorization: `Bearer ${Cypress.env("token")}`,
        },
      }).then((response) => {
        expect(response.status).to.ok;
        expect(response.body.data).to.deep.equal([]);
      })
    })
  })
})