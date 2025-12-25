import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { hashPassword, generateToken } from '@/lib/auth';
import { User, Transaction } from '@/lib/types';
import { BILLING_CONFIG } from '@/lib/billing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection<User>('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user with initial credits
    const newUser: User = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || email.split('@')[0],
      credits: BILLING_CONFIG.INITIAL_CREDITS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    // Create initial transaction record
    const transactionsCollection = db.collection<Transaction>('transactions');
    await transactionsCollection.insertOne({
      userId: result.insertedId,
      amount: BILLING_CONFIG.INITIAL_CREDITS,
      type: 'topup',
      description: 'Initial signup bonus',
      status: 'completed',
      createdAt: new Date(),
    });

    // Generate JWT token
    const token = generateToken({
      userId: result.insertedId.toString(),
      email: newUser.email,
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      token,
      user: {
        id: result.insertedId,
        email: newUser.email,
        name: newUser.name,
        credits: newUser.credits,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
