-- Folio Resume Builder — Migration 003: Require new ₹49 payment after editing a resume
-- Run this in Supabase Dashboard → SQL Editor → New Query.
-- No edits = unlimited free re-downloads. Any edit to resume content, template, or customization
-- resets is_paid to false so the updated resume requires a new ₹49 payment to download.

create or replace function public.protect_resume_entitlement()
returns trigger
language plpgsql
as $$
begin
  if current_setting('request.jwt.claim.role', true) in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.is_paid := false;
      new.paid_at := null;
    elsif tg_op = 'UPDATE' then
      if (
        new.template_id is distinct from old.template_id
        or new.resume_data is distinct from old.resume_data
        or new.customization_data is distinct from old.customization_data
      ) then
        -- Resume was edited: revoke previous download unlock so the updated version requires ₹49
        new.is_paid := false;
        new.paid_at := null;
      else
        -- No content/design edits: preserve server-verified entitlement (still blocks forging true)
        new.is_paid := old.is_paid;
        new.paid_at := old.paid_at;
      end if;
    end if;
  end if;
  return new;
end;
$$;
