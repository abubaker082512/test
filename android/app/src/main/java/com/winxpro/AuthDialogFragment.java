package com.winxpro;

import android.app.Dialog;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;
import com.google.android.material.textfield.TextInputEditText;

public class AuthDialogFragment extends DialogFragment {

    public interface AuthListener {
        void onAuthSuccess();
    }

    private AuthListener listener;

    public static AuthDialogFragment newInstance(AuthListener listener) {
        AuthDialogFragment fragment = new AuthDialogFragment();
        fragment.listener = listener;
        return fragment;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.dialog_auth, container, false);

        TextInputEditText etUsername = view.findViewById(R.id.et_username);
        TextInputEditText etPassword = view.findViewById(R.id.et_password);
        Button btnLogin = view.findViewById(R.id.btn_submit_login);
        Button btnRegister = view.findViewById(R.id.btn_quick_guest);

        btnLogin.setOnClickListener(v -> {
            String u = etUsername.getText() != null ? etUsername.getText().toString().trim() : "";
            String p = etPassword.getText() != null ? etPassword.getText().toString().trim() : "";

            if (TextUtils.isEmpty(u)) {
                Toast.makeText(getContext(), "Please enter your username or phone number", Toast.LENGTH_SHORT).show();
                return;
            }
            if (TextUtils.isEmpty(p)) {
                Toast.makeText(getContext(), "Please enter your password", Toast.LENGTH_SHORT).show();
                return;
            }

            UserSessionManager session = new UserSessionManager(requireContext());
            session.saveSession("usr_" + System.currentTimeMillis(), u, u + "@winxpro.com.pk", 10000.0);
            Toast.makeText(getContext(), "Welcome back, " + u + "!", Toast.LENGTH_SHORT).show();

            if (listener != null) {
                listener.onAuthSuccess();
            }
            dismiss();
        });

        btnRegister.setOnClickListener(v -> {
            String u = etUsername.getText() != null ? etUsername.getText().toString().trim() : "";
            if (TextUtils.isEmpty(u)) u = "Player" + (int)(Math.random() * 8999 + 1000);

            UserSessionManager session = new UserSessionManager(requireContext());
            session.saveSession("usr_" + System.currentTimeMillis(), u, u + "@winxpro.com.pk", 10000.0);
            Toast.makeText(getContext(), "Account created successfully! Welcome " + u + "!", Toast.LENGTH_SHORT).show();

            if (listener != null) {
                listener.onAuthSuccess();
            }
            dismiss();
        });

        return view;
    }

    @Override
    public void onStart() {
        super.onStart();
        Dialog dialog = getDialog();
        if (dialog != null && dialog.getWindow() != null) {
            dialog.getWindow().setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        }
    }
}
