<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['notifications' => $notifications]);
    }

    public function toggleRead(Request $request, $id)
    {
        $user = $request->user();
        $notification = Notification::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        $notification->update(['read' => $request->input('read', !$notification->read)]);

        return response()->json(['notification' => $notification]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $notification = Notification::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        $notification->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    public function clearAll(Request $request)
    {
        $user = $request->user();
        Notification::where('user_id', $user->id)->delete();

        return response()->json(['message' => 'All notifications cleared']);
    }
}
