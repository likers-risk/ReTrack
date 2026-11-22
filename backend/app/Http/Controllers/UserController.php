<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Order_item;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function register(Request $request)
    {

        $user = $request->user();

        if ($user->role !== 'Admin') {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 403);
        }


        $validatedData = $request->validate([
            'username' => 'required|unique:users,username',
            'email' => 'required|email|unique:users,email',
            'password' => 'required',
            'role' => 'required|in:Staff,Admin',
            'image' => 'nullable|image|mimes:png,jpeg,gif,svg,webp|max:2048'
        ]);

        if ($request->hasFile('image')) {
            $validatedData['image'] = $request->file('image')->store('images', 'public');
        }

        // Accounts created by an Admin can log in right away.
        $validatedData['status'] = 'approved';

        $validatedData['password'] = Hash::make($validatedData['password']);

        $users = User::create($validatedData);

        return response()->json([
            'message' => 'Registered Successfully',
            'User' => $users
        ], 200);
    }


    /**
     * Public sign-up.
     * - The very first account becomes the Admin (the business owner) and can log in right away.
     * - Everyone after that becomes Staff and must be approved by an Admin first.
     */
    public function signup(Request $request)
    {
        $validatedData = $request->validate([
            'username' => 'required|string|max:255|unique:users,username',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $isFirstAccount = User::count() === 0;

        User::create([
            'username' => $validatedData['username'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'role' => $isFirstAccount ? 'Admin' : 'Staff',
            'status' => $isFirstAccount ? 'approved' : 'pending',
        ]);

        return response()->json([
            'message' => $isFirstAccount
                ? 'Admin account created! You can now log in.'
                : 'Account created! An admin needs to approve it before you can log in.',
            'can_login' => $isFirstAccount,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required',
        ]);

        // The role comes from the account itself, not from the login form.
        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'Error' => 'Incorrect Username or Password'
            ]);
        }

        if ($user->status !== 'approved') {
            throw ValidationException::withMessages([
                'Error' => 'Your account is still waiting for admin approval.'
            ]);
        }

        $token = $user->createToken('user-auth-token')->plainTextToken;


        return response()->json([
            'message' => 'Login Successfully',
            'User' => $user,
            'Token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();

        return response()->json([
            'message' => 'Logout Successfully'
        ]);
    }

    public function index($userId)
    {
        $userProfile = User::find($userId);

        if (!$userProfile) {
            return response()->json([
                'error' => 'User not found',
            ], 404);
        }

        return response()->json([
            'user' => $userProfile,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $updateData = $request->validate([
            'image' => 'nullable|image|mimes:png,jpeg,gif,svg,webp|max:2048'
        ]);


        if ($request->hasFile('image')) {
            if ($user->image) {
                Storage::disk('public')->delete($user->image);
            }
            $imagePath = $request->file('image')->store('images', 'public');
            $user->image = $imagePath;
        }

        // You may want to update other fields here as well
        // $user->username = $request->username;
        // $user->email = $request->email;

        $user->save();

        return response()->json([
            'message' => 'Successfully Updated Profile',
            'User' => $user
        ]);
    }

    /** List accounts waiting for approval (Admin only). */
    public function pendingUsers(Request $request)
    {
        if ($request->user()->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $users = User::where('status', 'pending')
            ->orderBy('created_at')
            ->get(['id', 'username', 'email', 'role', 'created_at']);

        return response()->json(['users' => $users]);
    }

    /** Approve a pending account (Admin only). */
    public function approveUser(Request $request, $id)
    {
        if ($request->user()->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $user = User::where('status', 'pending')->find($id);
        if (!$user) {
            return response()->json(['message' => 'Pending user not found.'], 404);
        }

        $user->status = 'approved';
        $user->save();

        return response()->json(['message' => "{$user->username} has been approved."]);
    }

    /** Reject (delete) a pending account (Admin only). */
    public function rejectUser(Request $request, $id)
    {
        if ($request->user()->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $user = User::where('status', 'pending')->find($id);
        if (!$user) {
            return response()->json(['message' => 'Pending user not found.'], 404);
        }

        $username = $user->username;
        $user->delete();

        return response()->json(['message' => "{$username}'s sign-up was rejected."]);
    }
}
