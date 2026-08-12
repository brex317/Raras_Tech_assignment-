using Application.DTOs.OrganizationUnits;
using FluentValidation;

namespace Application.Validators;

public class CreateOrganizationUnitRequestValidator : AbstractValidator<CreateOrganizationUnitRequest>
{
    public CreateOrganizationUnitRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Code is required.")
            .MaximumLength(20).WithMessage("Code must not exceed 20 characters.")
            .Matches("^[A-Za-z0-9-]+$").WithMessage("Code can only contain letters, numbers, and hyphens.");
    }
}

public class UpdateOrganizationUnitRequestValidator : AbstractValidator<UpdateOrganizationUnitRequest>
{
    public UpdateOrganizationUnitRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(100).WithMessage("Name must not exceed 100 characters.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Code is required.")
            .MaximumLength(20).WithMessage("Code must not exceed 20 characters.")
            .Matches("^[A-Za-z0-9-]+$").WithMessage("Code can only contain letters, numbers, and hyphens.");
    }
}
