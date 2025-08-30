import { query, mutation, v } from 'convex/server'
import { Id } from './_generated/dataModel'

// Query to get all users
export const getUsers = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { limit = 100, offset = 0 } = args
    
    const users = await ctx.db
      .query('users')
      .order('desc')
      .paginate({ numItems: limit, cursor: offset })
    
    return users
  },
})

// Query to get a single user by Clerk ID
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first()
    
    return user
  },
})

// Query to get a single user by Convex ID
export const getUserById = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id)
    return user
  },
})

// Mutation to create or update a user (upsert)
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    lastSignInAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first()
    
    const now = Date.now()
    
    if (existingUser) {
      // Update existing user
      return await ctx.db.patch(existingUser._id, {
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        imageUrl: args.imageUrl,
        bio: args.bio,
        lastSignInAt: args.lastSignInAt,
        updatedAt: now,
      })
    } else {
      // Create new user
      return await ctx.db.insert('users', {
        clerkId: args.clerkId,
        firstName: args.firstName,
        lastName: args.lastName,
        email: args.email,
        imageUrl: args.imageUrl,
        bio: args.bio,
        createdAt: now,
        updatedAt: now,
        lastSignInAt: args.lastSignInAt,
      })
    }
  },
})

// Mutation to update user last sign in
export const updateLastSignIn = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first()
    
    if (user) {
      await ctx.db.patch(user._id, {
        lastSignInAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
  },
})

// Mutation to delete a user
export const deleteUser = mutation({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})

// Mutation to delete user by Clerk ID
export const deleteUserByClerkId = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .first()
    
    if (user) {
      await ctx.db.delete(user._id)
    }
  },
})
